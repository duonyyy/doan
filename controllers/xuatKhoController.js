const { XuatKho, ChiTietXuat, KhoHang, SanPham, TonKho } = require('../models');
const { Op } = require('sequelize');
const { getDbFromRequest } = require('../config/db.config'); // Giả định đường dẫn này đúng
// GET /api/xuatkho - Lấy danh sách xuất kho
const getAllXuatKho = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, MaKho, fromDate, toDate } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause = {
        GhiChu: { [Op.like]: `%${search}%` },
      };
    }
    if (MaKho) {
      whereClause.MaKho = MaKho;
    }
    if (fromDate && toDate) {
      whereClause.NgayXuat = {
        [Op.between]: [fromDate, toDate],
      };
    }

    const { count, rows } = await XuatKho.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ['NgayXuat', 'DESC'],
        ['MaXuat', 'DESC'],
      ],
      include: [
        {
          model: KhoHang,
          as: 'KhoHang',
          include: [
            {
              model: require('../models').KhuVuc,
              as: 'KhuVuc',
            },
          ],
        },
        {
          model: ChiTietXuat,
          as: 'ChiTietXuats',
          include: [
            {
              model: SanPham,
              as: 'SanPham',
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
      message: 'Lỗi khi lấy danh sách xuất kho',
      error: error.message,
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
              as: 'KhuVuc',
            },
          ],
        },
        {
          model: ChiTietXuat,
          as: 'ChiTietXuats',
          include: [
            {
              model: SanPham,
              as: 'SanPham',
            },
          ],
        },
      ],
    });

    if (!xuatKho) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu xuất kho',
      });
    }

    res.json({
      success: true,
      data: xuatKho,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin xuất kho',
      error: error.message,
    });
  }
};

// Giả định bạn có hàm này để định tuyến đến đúng DB (Master hoặc Shard)

const createXuatKho = async (req, res) => {
  // 1. ĐỊNH TUYẾN: Lấy kết nối DB (Master/Shard)
  // Việc định tuyến này phụ thuộc vào ShardKey hoặc MaKhuVuc có trong req.body
  const db = await getDbFromRequest(req);
  if (!db) {
    return res.status(500).json({
      success: false,
      message:
        'Lỗi cấu hình Shard hoặc thiếu thông tin định tuyến (ShardKey/MaKhuVuc)',
    });
  }

  try {
    const { MaKho, NgayXuat, GhiChu, chiTietXuat } = req.body;

    // Validation cơ bản
    if (!MaKho || !NgayXuat || !chiTietXuat || chiTietXuat.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'Thông tin phiếu xuất không hợp lệ: Thiếu Kho, Ngày xuất hoặc Chi tiết xuất.',
      });
    }

    // 2. TẠO CHUỖI SQL GỌI STRORED PROCEDURE (sp_TaoPhieuXuat)

    let sql = `
            -- Khai báo kiểu bảng và biến OUTPUT
            -- Lưu ý: Bạn phải đảm bảo kiểu bảng dbo.ChiTietXuat_Type đã được tạo trên DB này!
            DECLARE @ChiTietXuat AS dbo.ChiTietXuat_Type; 
            DECLARE @MaXuatMoi INT;
        `;

    // Điền dữ liệu chi tiết vào bảng tạm @ChiTietXuat
    for (const item of chiTietXuat) {
      // Đảm bảo escape các ký tự đặc biệt ('') cho chuỗi NVARCHAR (Note)
      const note = item.Note ? item.Note.replace(/'/g, "''") : '';

      // Đảm bảo GiaXuat luôn là số
      const giaXuat = parseFloat(item.GiaXuat) || 0;

      sql += `
                INSERT INTO @ChiTietXuat (MaSP, SoLuong, GiaXuat, Note)
                VALUES (${item.MaSP}, ${item.SoLuong}, ${giaXuat}, N'${note}');
            `;
    }

    // Đảm bảo escape GhiChu
    const ghiChu = GhiChu ? GhiChu.replace(/'/g, "''") : '';

    // Gọi Stored Procedure chính
    // Chú ý: Cú pháp gọi SP phải khớp với định nghĩa T-SQL (@MaKho, @NgayXuat, @GhiChu, @ChiTietXuat, @MaXuat_Output)
    sql += `
            EXEC sp_TaoPhieuXuat 
                @MaKho = ${MaKho}, 
                @NgayXuat = '${NgayXuat}', 
                @GhiChu = N'${ghiChu}',
                @ChiTietXuat = @ChiTietXuat,
                @MaXuat_Output = @MaXuatMoi OUTPUT;
            
            -- Trả về MaXuatMoi
            SELECT @MaXuatMoi AS MaXuat;
        `;

    // 3. THỰC THI QUERY (Tất cả logic transaction, kiểm tra tồn kho nằm trong SP)
    const result = await db.query(sql, {
      type: db.QueryTypes.SELECT, // Để lấy MaXuat trả về
    });

    // Lấy MaXuat từ kết quả trả về
    const MaXuat = result[0]?.MaXuat;

    if (!MaXuat) {
      // Lỗi này xảy ra khi SP thất bại (thường do lỗi kiểm tra tồn kho, hoặc lỗi SQL khác)
      return res.status(500).json({
        success: false,
        message:
          'Thực thi Stored Procedure thất bại hoặc không lấy được ID mới (Kiểm tra Log SQL).',
      });
    }

    const newXuatKhoData = { MaXuat, MaKho, NgayXuat, GhiChu };

    // 4. Nếu cần, thực hiện Broadcast
    // (Giả định bạn đã có khoHang và MaKhuVuc để broadcast)
    // if (global.socketServer) {
    //     const khoHang = await db.models.KhoHang.findByPk(MaKho); // Cần truy vấn lại nếu muốn có MaKhuVuc
    //     global.socketServer.broadcastInventoryUpdate(
    //         khoHang.MaKhuVuc, // Cần đảm bảo có
    //         MaKho,
    //         'xuat-kho',
    //         { maXuat: MaXuat, ngayXuat: NgayXuat, chiTiet: chiTietXuat }
    //     );
    // }

    res.status(201).json({
      success: true,
      message: 'Tạo phiếu xuất kho thành công',
      data: newXuatKhoData,
    });
  } catch (error) {
    console.error('Lỗi createXuatKho (SP):', error);

    // Lấy thông báo lỗi SQL từ lỗi trả về (đặc biệt là lỗi RAISERROR về Tồn Kho)
    const sqlErrorMessage = error.original?.message || error.message;

    // Xử lý thông báo lỗi Tồn Kho cụ thể từ RAISERROR trong SP
    const isStockError = sqlErrorMessage.includes('Kho không đủ tồn kho');
    const statusCode = isStockError ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      message: 'Lỗi khi tạo phiếu xuất kho. Chi tiết: ' + sqlErrorMessage,
      error: error.message,
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
        message: 'Không tìm thấy phiếu xuất kho',
      });
    }

    await xuatKho.update({
      NgayXuat: NgayXuat || xuatKho.NgayXuat,
      GhiChu: GhiChu !== undefined ? GhiChu : xuatKho.GhiChu,
    });

    res.json({
      success: true,
      message: 'Cập nhật phiếu xuất kho thành công',
      data: xuatKho,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật phiếu xuất kho',
      error: error.message,
    });
  }
};

// DELETE /api/xuatkho/:id - Xóa phiếu xuất kho
const deleteXuatKho = async (req, res) => {
  const transaction = await require('../config/db.config')
    .getDbConnection()
    .transaction();

  try {
    const { id } = req.params;

    const xuatKho = await XuatKho.findByPk(id, {
      include: [
        {
          model: ChiTietXuat,
          as: 'ChiTietXuats',
        },
      ],
    });

    if (!xuatKho) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu xuất kho',
      });
    }

    // Reverse inventory changes
    for (const chiTiet of xuatKho.ChiTietXuats) {
      const tonKho = await TonKho.findOne({
        where: { MaSP: chiTiet.MaSP, MaKho: xuatKho.MaKho },
      });

      if (tonKho) {
        await tonKho.update(
          {
            SoLuongTon: tonKho.SoLuongTon + chiTiet.SoLuong,
          },
          { transaction }
        );
      }
    }

    // Delete export details
    await ChiTietXuat.destroy({
      where: { MaXuat: id },
      transaction,
    });

    // Delete export record
    await xuatKho.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Xóa phiếu xuất kho thành công',
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phiếu xuất kho',
      error: error.message,
    });
  }
};

module.exports = {
  getAllXuatKho,
  getXuatKhoById,
  createXuatKho,
  updateXuatKho,
  deleteXuatKho,
};
