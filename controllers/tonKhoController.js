const {
  TonKho,

  SanPham,

  KhoHang,

  sequelize, // Cần cho các hàm tổng hợp (SUM, fn)
} = require('../models');

const { Op } = require('sequelize');

// GET /api/tonkho - Lấy danh sách tồn kho (Phân trang, tìm kiếm, lọc)

const getAllTonKho = async (req, res) => {
  try {
    const {
      page = 1,

      limit = 10,

      search,

      MaKho,

      MaSP,

      minQuantity,

      maxQuantity,
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = {};

    if (MaKho) whereClause.MaKho = MaKho;

    if (MaSP) whereClause.MaSP = MaSP;

    if (minQuantity !== undefined || maxQuantity !== undefined) {
      whereClause.SoLuongTon = {};

      if (minQuantity !== undefined)
        whereClause.SoLuongTon[Op.gte] = minQuantity;

      if (maxQuantity !== undefined)
        whereClause.SoLuongTon[Op.lte] = maxQuantity;
    }

    const { count, rows } = await TonKho.findAndCountAll({
      where: whereClause,

      limit: parseInt(limit),

      offset: parseInt(offset),

      order: [
        ['MaKho', 'ASC'],

        ['MaSP', 'ASC'],
      ],

      include: [
        {
          model: SanPham,

          as: 'SanPham',

          where: search
            ? {
                [Op.or]: [
                  // Khớp với DB: TenSP, MoTa

                  { TenSP: { [Op.like]: `%${search}%` } },

                  { MoTa: { [Op.like]: `%${search}%` } },
                ],
              }
            : undefined,

          required: !!search, // INNER JOIN nếu có tìm kiếm, LEFT JOIN nếu không
        },

        {
          model: KhoHang,

          as: 'KhoHang',

          include: [
            {
              model: require('../models').KhuVuc, // Đã khớp

              as: 'KhuVuc',
            },
          ],
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

      message: 'Lỗi khi lấy danh sách tồn kho',

      error: error.message,
    });
  }
};

// GET /api/tonkho/:maSP/:maKho - Lấy tồn kho theo ID (khóa phức hợp)

const getTonKhoById = async (req, res) => {
  try {
    const { maSP, maKho } = req.params;

    // Khớp với DB: Dùng MaSP và MaKho làm khóa chính

    const tonKho = await TonKho.findOne({
      where: { MaSP: maSP, MaKho: maKho },

      include: [
        {
          model: SanPham,

          as: 'SanPham',

          include: [
            {
              model: require('../models').NhaCungCap, // Đã khớp

              as: 'NhaCungCap',
            },
          ],
        },

        {
          model: KhoHang,

          as: 'KhoHang',

          include: [
            {
              model: require('../models').KhuVuc, // Đã khớp

              as: 'KhuVuc',
            },
          ],

          C,
        },
      ],
    });

    if (!tonKho) {
      return res.status(404).json({
        success: false,

        message: 'Không tìm thấy tồn kho',
      });
    }

    res.json({
      success: true,

      data: tonKho,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: 'Lỗi khi lấy thông tin tồn kho',

      error: error.message,
    });
  }
};

// GET /api/tonkho/summary - Lấy tổng kết tồn kho chung

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

          as: 'SanPham',
        },

        {
          model: KhoHang,

          as: 'KhoHang',

          // Không cần include KhuVuc ở đây vì chỉ cần TenKho

          attributes: ['TenKho'],
        },
      ],
    });

    // Calculate summary statistics

    const totalProducts = tonKhoData.length; // Tổng số *dòng* tồn kho

    const totalQuantity = tonKhoData.reduce(
      (sum, item) => sum + item.SoLuongTon, // Khớp với DB: SoLuongTon

      0
    );

    const lowStockItems = tonKhoData.filter(
      (item) => item.SoLuongTon <= 10
    ).length;

    const outOfStockItems = tonKhoData.filter(
      (item) => item.SoLuongTon === 0
    ).length;

    // Group by warehouse

    const warehouseSummary = tonKhoData.reduce((acc, item) => {
      const warehouseName = item.KhoHang.TenKho; // Khớp với DB: TenKho

      if (!acc[warehouseName]) {
        acc[warehouseName] = {
          totalProducts: 0,

          totalQuantity: 0,

          lowStockItems: 0,
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

          outOfStockItems,
        },

        warehouseSummary,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: 'Lỗi khi lấy tổng kết tồn kho',

      error: error.message,
    });
  }
};

// GET /api/tonkho/summary-by-product - Lấy tổng tồn kho theo từng sản phẩm

const getTonKhoSummaryByProduct = async (req, res) => {
  try {
    const { search } = req.query;

    let includeWhere = {};

    if (search) {
      includeWhere = {
        [Op.or]: [
          { TenSP: { [Op.like]: `%${search}%` } },

          { MoTa: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    const productSummary = await TonKho.findAll({
      attributes: [
        'MaSP',

        [
          sequelize.fn('SUM', sequelize.col('TonKho.SoLuongTon')),

          'TongSoLuongTon',
        ],
      ],

      include: [
        {
          model: SanPham,

          as: 'SanPham',

          // *** ĐIỀU CHỈNH ***: Sửa 'DonViTinh' thành 'DonVi' để khớp schema

          attributes: ['TenSP', 'MoTa', 'DonVi'],

          where: includeWhere,

          required: true,
        },
      ],

      group: [
        'TonKho.MaSP',

        'SanPham.MaSP',

        'SanPham.TenSP',

        'SanPham.MoTa',

        // *** ĐIỀU CHỈNH ***: Sửa 'DonViTinh' thành 'DonVi' để khớp schema

        'SanPham.DonVi',
      ],

      order: [
        [sequelize.fn('SUM', sequelize.col('TonKho.SoLuongTon')), 'DESC'],
      ],
    });

    res.json({
      success: true,

      data: productSummary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: 'Lỗi khi lấy tổng kết tồn kho theo sản phẩm',

      error: error.message,
    });
  }
};

// GET /api/tonkho/summary/product/:maSP - Lấy tổng tồn kho của 1 sản phẩm

const getTotalTonKhoByMaSP = async (req, res) => {
  try {
    const { maSP } = req.params;

    const sanPham = await SanPham.findByPk(maSP, {
      // *** ĐIỀU CHỈNH ***: Sửa 'DonViTinh' thành 'DonVi' để khớp schema

      attributes: ['MaSP', 'TenSP', 'DonVi', 'MoTa'],
    });

    if (!sanPham) {
      return res.status(404).json({
        success: false,

        message: 'Không tìm thấy sản phẩm',
      });
    }

    const tongSoLuongTon = await TonKho.sum('SoLuongTon', {
      where: { MaSP: maSP },
    });

    res.json({
      success: true,

      data: {
        ...sanPham.toJSON(),

        TongSoLuongTon: tongSoLuongTon || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: 'Lỗi khi lấy tổng tồn kho cho sản phẩm',

      error: error.message,
    });
  }
};

// GET /api/tonkho/grand-total - Lấy tổng số lượng tất cả sản phẩm trên tất cả kho

const getGrandTotalQuantity = async (req, res) => {
  try {
    // Khớp với DB: Tính tổng cột 'SoLuongTon'

    const grandTotal = await TonKho.sum('SoLuongTon');

    res.json({
      success: true,

      data: {
        TongSoLuongTonTatCaKho: grandTotal || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: 'Lỗi khi lấy tổng tồn kho toàn bộ',

      error: error.message,
    });
  }
};

// PUT /api/tonkho/:maSP/:maKho - Cập nhật tồn kho

const updateTonKho = async (req, res) => {
  try {
    const { maSP, maKho } = req.params;

    const { SoLuongTon } = req.body; // Khớp với DB: SoLuongTon

    if (SoLuongTon === undefined || SoLuongTon < 0) {
      return res.status(400).json({
        success: false,

        message: 'Số lượng tồn kho phải >= 0',
      });
    }

    // Khớp với DB: Tìm bằng khóa phức hợp MaSP, MaKho

    const tonKho = await TonKho.findOne({
      where: { MaSP: maSP, MaKho: maKho },
    });

    if (!tonKho) {
      return res.status(404).json({
        success: false,

        message: 'Không tìm thấy tồn kho',
      });
    }

    await tonKho.update({
      SoLuongTon,
    });

    res.json({
      success: true,

      message: 'Cập nhật tồn kho thành công',

      data: tonKho,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: 'Lỗi khi cập nhật tồn kho',

      error: error.message,
    });
  }
};

// DELETE /api/tonkho/:maSP/:maKho - Xóa tồn kho

const deleteTonKho = async (req, res) => {
  try {
    const { maSP, maKho } = req.params;

    // Khớp với DB: Tìm bằng khóa phức hợp MaSP, MaKho

    const tonKho = await TonKho.findOne({
      where: { MaSP: maSP, MaKho: maKho },
    });

    if (!tonKho) {
      return res.status(404).json({
        success: false,

        message: 'Không tìm thấy tồn kho',
      });
    }

    // Chỉ cho xóa khi SoLuongTon = 0

    if (tonKho.SoLuongTon > 0) {
      return res.status(400).json({
        success: false,

        message: 'Không thể xóa tồn kho khi còn số lượng > 0',
      });
    }

    await tonKho.destroy();

    res.json({
      success: true,

      message: 'Xóa tồn kho thành công',
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: 'Lỗi khi xóa tồn kho',

      error: error.message,
    });
  }
};

// GET /api/tonkho/detailed-list - Lấy danh sách tồn kho chi tiết
// ĐÃ RÚT GỌN: Chỉ phân trang và lọc theo MaKho
// GET /api/tonkho/detailed-list
// ĐÃ CẬP NHẬT: Thay đổi sắp xếp sang MaSP

const getDetailedInventoryList = async (req, res) => {
  try {
    // 1. Lấy query params (Thêm lại TenSP, TenKho)
    const {
      page = 1,
      limit = 10,
      MaKho,
      MaSP,
      TenSP, // <--- THÊM LẠI: Dùng để tìm kiếm Tên Sản Phẩm
      TenKho, // <--- THÊM LẠI: Dùng để tìm kiếm Tên Kho
    } = req.query;
    const offset = (page - 1) * limit;

    // 2. Xây dựng điều kiện WHERE
    let whereClause = {};

    // Lọc chính xác (ID)
    if (MaKho) {
      whereClause.MaKho = MaKho;
    }
    if (MaSP) {
      whereClause.MaSP = MaSP;
    }

    // Lọc TÌM KIẾM (LIKE) theo tên
    if (TenSP) {
      // Dùng $...$ để tham chiếu đến cột của bảng đã JOIN
      whereClause['$SanPham.TenSP$'] = { [Op.like]: `%${TenSP}%` };
    }
    if (TenKho) {
      whereClause['$KhoHang.TenKho$'] = { [Op.like]: `%${TenKho}%` };
    }

    // 3. Thực thi query
    const { count, rows } = await TonKho.findAndCountAll({
      where: whereClause, // Áp dụng tất cả điều kiện
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['MaSP', 'MaKho', 'SoLuongTon'],
      include: [
        {
          model: SanPham,
          as: 'SanPham',
          attributes: ['TenSP'],
          required: true,
        },
        {
          model: KhoHang,
          as: 'KhoHang',
          attributes: ['TenKho'],
          required: true,
        },
      ],
      order: [
        ['MaKho', 'ASC'], // Sắp xếp theo Kho
        ['MaSP', 'ASC'], // Sắp xếp theo Mã SP
      ],
      distinct: true,
    });

    // 4. Trả về kết quả
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
      message: 'Lỗi khi lấy danh sách tồn kho chi tiết',
      error: error.message,
    });
  }
};

module.exports = {
  getAllTonKho,

  getTonKhoById,

  getTonKhoSummary,

  getTonKhoSummaryByProduct,

  getTotalTonKhoByMaSP,

  getGrandTotalQuantity,

  updateTonKho,

  deleteTonKho,
  getDetailedInventoryList,
};
